import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from torch.optim.lr_scheduler import CosineAnnealingLR
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score, precision_score, recall_score
import numpy as np
from tqdm import tqdm
from models.convlstm import FireSenseModel

# Hyperparameters
BATCH_SIZE = 8
LEARNING_RATE = 1e-4
WEIGHT_DECAY = 1e-4
EPOCHS = 50
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def train_one_epoch(model, dataloader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    all_preds = []
    all_labels = []

    for inputs, labels in tqdm(dataloader, desc="Training"):
        inputs, labels = inputs.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        
        preds = torch.argmax(outputs, dim=1).cpu().numpy()
        all_preds.extend(preds.flatten())
        all_labels.extend(labels.cpu().numpy().flatten())

    epoch_loss = running_loss / len(dataloader)
    epoch_acc = accuracy_score(all_labels, all_preds)
    return epoch_loss, epoch_acc

def validate(model, dataloader, criterion, device):
    model.eval()
    running_loss = 0.0
    all_preds = []
    all_probs = []
    all_labels = []

    with torch.no_grad():
        for inputs, labels in tqdm(dataloader, desc="Validation"):
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            running_loss += loss.item()
            
            probs = torch.softmax(outputs, dim=1).cpu().numpy()
            preds = torch.argmax(outputs, dim=1).cpu().numpy()
            
            all_probs.extend(probs.transpose(0, 2, 3, 1).reshape(-1, 3))
            all_preds.extend(preds.flatten())
            all_labels.extend(labels.cpu().numpy().flatten())

    val_loss = running_loss / len(dataloader)
    val_acc = accuracy_score(all_labels, all_preds)
    
    # Per-class AUC
    try:
        val_auc = roc_auc_score(all_labels, all_probs, multi_class='ovr', average='macro')
    except:
        val_auc = 0.0
        
    return val_loss, val_acc, val_auc

def main():
    os.makedirs("ml/checkpoints", exist_ok=True)
    os.makedirs("ml/logs", exist_ok=True)

    # Load data
    train_data, train_labels = torch.load("ml/data/processed/train.pt", weights_only=False)
    val_data, val_labels = torch.load("ml/data/processed/val.pt", weights_only=False)
    
    train_dataset = TensorDataset(train_data, train_labels)
    val_dataset = TensorDataset(val_data, val_labels)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    # Model, Loss, Optimizer
    model = FireSenseModel().to(DEVICE)
    class_weights = torch.tensor([1.0, 2.0, 4.0]).to(DEVICE)
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    scheduler = CosineAnnealingLR(optimizer, T_max=EPOCHS)

    best_val_auc = 0.0
    history = {"train_loss": [], "val_loss": [], "val_acc": [], "val_auc": []}

    for epoch in range(1, EPOCHS + 1):
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, DEVICE)
        val_loss, val_acc, val_auc = validate(model, val_loader, criterion, DEVICE)
        scheduler.step()

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)
        history["val_auc"].append(val_auc)

        print(f"Epoch {epoch}/{EPOCHS} - Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}, Val AUC: {val_auc:.4f}")

        if val_auc > best_val_auc:
            best_val_auc = val_auc
            torch.save(model.state_dict(), "ml/checkpoints/best_model.pt")
            print(f"Best model saved with AUC: {val_auc:.4f}")

    # Save history
    with open("ml/logs/training_history.json", "w") as f:
        json.dump(history, f)

if __name__ == "__main__":
    main()
