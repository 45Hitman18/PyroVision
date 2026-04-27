import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, random_split
import matplotlib.pyplot as plt
import os, json

DATA_DIR = "../data"
MODEL_PATH = "models/mobilenetv2_fire.pth"
EPOCHS = 10
BATCH_SIZE = 32
IMG_SIZE = 224

# --- Data transforms ---
train_transforms = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.3, contrast=0.3),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

val_transforms = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# --- Load dataset ---
full_dataset = datasets.ImageFolder(DATA_DIR, transform=train_transforms)
classes = full_dataset.classes
print(f"Classes found: {classes}")
print(f"Total images: {len(full_dataset)}")

# 80/20 train-val split
val_size = int(0.2 * len(full_dataset))
train_size = len(full_dataset) - val_size
train_set, val_set = random_split(full_dataset, [train_size, val_size])
val_set.dataset.transform = val_transforms

train_loader = DataLoader(train_set, batch_size=BATCH_SIZE, shuffle=True)
val_loader   = DataLoader(val_set,   batch_size=BATCH_SIZE, shuffle=False)

# --- Build model ---
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Training on: {device}")

model = models.mobilenet_v2(weights="IMAGENET1K_V1")
model.classifier[1] = nn.Linear(1280, len(classes))
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.0003)
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=4, gamma=0.5)

# --- Training loop ---
history = {"train_acc": [], "val_acc": [], "train_loss": [], "val_loss": []}

best_val_acc = 0.0

for epoch in range(EPOCHS):
    # Train
    model.train()
    correct, total, running_loss = 0, 0, 0.0
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        correct += predicted.eq(labels).sum().item()
        total += labels.size(0)

    train_acc  = 100.0 * correct / (total + 1e-8)
    train_loss = running_loss / (len(train_loader) + 1e-8)

    # Validate
    model.eval()
    correct, total, running_loss = 0, 0, 0.0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            correct += predicted.eq(labels).sum().item()
            total += labels.size(0)

    val_acc  = 100.0 * correct / (total + 1e-8)
    val_loss = running_loss / (len(val_loader) + 1e-8)

    history["train_acc"].append(round(train_acc, 2))
    history["val_acc"].append(round(val_acc, 2))
    history["train_loss"].append(round(train_loss, 4))
    history["val_loss"].append(round(val_loss, 4))

    print(f"Epoch [{epoch+1}/{EPOCHS}]  "
          f"Train: {train_acc:.1f}% / {train_loss:.4f}  |  "
          f"Val: {val_acc:.1f}% / {val_loss:.4f}")

    # Save best model
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        os.makedirs("models", exist_ok=True)
        torch.save(model.state_dict(), MODEL_PATH)
        print(f"  -> Best model saved ({val_acc:.1f}%)")

    scheduler.step()

# --- Save training history ---
with open("models/training_history.json", "w") as f:
    json.dump({"history": history, "classes": classes,
               "best_val_acc": round(best_val_acc, 2)}, f, indent=2)

print(f"\nTraining complete! Best val accuracy: {best_val_acc:.1f}%")

# --- Plot training curves ---
plt.figure(figsize=(12, 4))
plt.subplot(1, 2, 1)
plt.plot(history["train_acc"], label="Train")
plt.plot(history["val_acc"],   label="Val")
plt.title("Accuracy"); plt.xlabel("Epoch"); plt.legend()
plt.subplot(1, 2, 2)
plt.plot(history["train_loss"], label="Train")
plt.plot(history["val_loss"],   label="Val")
plt.title("Loss"); plt.xlabel("Epoch"); plt.legend()
plt.tight_layout()
plt.savefig("models/training_curves.png")
print("Training curves saved to models/training_curves.png")
