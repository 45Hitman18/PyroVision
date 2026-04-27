import os
import torch
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, roc_curve, auc, classification_report, precision_recall_fscore_support
from torch.utils.data import DataLoader, TensorDataset
from models.convlstm import FireSenseModel

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def plot_confusion_matrix(y_true, y_pred, classes, output_path):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=classes, yticklabels=classes)
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.title('Confusion Matrix')
    plt.savefig(output_path)
    plt.close()

def plot_roc_curves(y_true_onehot, y_probs, classes, output_path):
    plt.figure(figsize=(8, 6))
    for i in range(len(classes)):
        fpr, tpr, _ = roc_curve(y_true_onehot[:, i], y_probs[:, i])
        roc_auc = auc(fpr, tpr)
        plt.plot(fpr, tpr, label=f'{classes[i]} (AUC = {roc_auc:.2f})')
    
    plt.plot([0, 1], [0, 1], 'k--')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curves')
    plt.legend()
    plt.savefig(output_path)
    plt.close()

def main():
    os.makedirs("ml/outputs", exist_ok=True)
    
    # Load model
    model = FireSenseModel().to(DEVICE)
    model.load_state_dict(torch.load("ml/checkpoints/best_model.pt", map_location=DEVICE, weights_only=True))
    model.eval()

    # Load test data
    test_data, test_labels = torch.load("ml/data/processed/test.pt", weights_only=False)
    test_loader = DataLoader(TensorDataset(test_data, test_labels), batch_size=8, shuffle=False)

    all_preds = []
    all_probs = []
    all_labels = []

    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs = inputs.to(DEVICE)
            outputs = model(inputs)
            probs = torch.softmax(outputs, dim=1).cpu().numpy()
            preds = torch.argmax(outputs, dim=1).cpu().numpy()
            
            all_probs.extend(probs.transpose(0, 2, 3, 1).reshape(-1, 3))
            all_preds.extend(preds.flatten())
            all_labels.extend(labels.cpu().numpy().flatten())

    all_probs = np.array(all_probs)
    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)

    classes = ['LOW', 'MEDIUM', 'HIGH']
    
    # Save predictions
    np.save("ml/outputs/test_predictions.npy", all_preds)

    # Metrics
    print("Classification Report:")
    print(classification_report(all_labels, all_preds, target_names=classes))
    
    # Plots
    plot_confusion_matrix(all_labels, all_preds, classes, "ml/outputs/confusion_matrix.png")
    
    # One-hot labels for ROC
    y_true_onehot = np.eye(3)[all_labels]
    plot_roc_curves(y_true_onehot, all_probs, classes, "ml/outputs/roc_curve.png")
    
    print("Evaluation completed. Results saved in ml/outputs/")

if __name__ == "__main__":
    main()
