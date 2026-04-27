import torch
import torch.nn.functional as F
import numpy as np
import matplotlib.pyplot as plt
from captum.attr import LayerGradCam
from models.convlstm import FireSenseModel
import os

def generate_gradcam(input_tensor, target_class=2):
    """
    Generate Grad-CAM heatmap for a given input sequence.
    input_tensor: (1, 3, 7, H, W)
    target_class: index of the class to explain (default 2 for HIGH risk)
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = FireSenseModel().to(device)
    model.load_state_dict(torch.load("ml/checkpoints/best_model.pt", map_location=device, weights_only=True))
    model.eval()

    input_tensor = input_tensor.to(device)
    target_layer = model.get_gradcam_target_layer()

    # Initialize LayerGradCam
    lgc = LayerGradCam(model, target_layer)

    # Note: LayerGradCam expects target as (N,) for 2D outputs or (N, H, W) for 3D outputs.
    # Since we have a pixel-wise prediction, we target a specific pixel or the mean of the class.
    # For visualization, we'll take the mean of the logits for the target class across the spatial dimensions.
    
    # We define a wrapper to handle the pixel-wise output if needed, or just target the class.
    # Here we use the sum of logits for the target class across all pixels as the target.
    attribution = lgc.attribute(input_tensor, target=target_class)

    # attribution shape: same as target_layer output (1, channels, h', w')
    # Upsample to original resolution
    upsampled_attr = F.interpolate(attribution, size=input_tensor.shape[-2:], mode='bilinear', align_corners=False)
    
    # Normalize
    heatmap = upsampled_attr.squeeze().cpu().detach().numpy()
    if heatmap.ndim == 3: # If channels > 1, take mean
        heatmap = np.mean(heatmap, axis=0)
    
    heatmap = (heatmap - heatmap.min()) / (heatmap.max() - heatmap.min() + 1e-8)
    
    return heatmap

def save_gradcam_plot(heatmap, input_tensor, output_path):
    # Use NDVI channel of the last day in sequence for background
    # input_tensor: (1, 3, 7, H, W) -> last day is index 2, NDVI is index 0
    ndvi = input_tensor[0, 2, 0].cpu().numpy()
    
    plt.figure(figsize=(10, 8))
    plt.imshow(ndvi, cmap='gray')
    plt.imshow(heatmap, cmap='jet', alpha=0.5)
    plt.colorbar(label='Risk Activation')
    plt.title('Grad-CAM: Fire Risk Explanation (Overlay on NDVI)')
    plt.axis('off')
    plt.savefig(output_path)
    plt.close()

def main():
    os.makedirs("ml/outputs", exist_ok=True)
    
    # Load a sample from test set
    if os.path.exists("ml/data/processed/test.pt"):
        test_data, _ = torch.load("ml/data/processed/test.pt", weights_only=False)
        sample = test_data[0:1] # (1, 3, 7, H, W)
    else:
        # Generate dummy sample if data doesn't exist
        print("Data not found, generating dummy sample for Grad-CAM demo.")
        sample = torch.randn(1, 3, 7, 128, 128)

    heatmap = generate_gradcam(sample, target_class=2)
    save_gradcam_plot(heatmap, sample, "ml/outputs/gradcam_sample.png")
    print("Grad-CAM heatmap saved to ml/outputs/gradcam_sample.png")

if __name__ == "__main__":
    main()
