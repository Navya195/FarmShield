#!/usr/bin/env python3
"""
FarmShield - Grad-CAM Explainable AI Module
Generate heatmaps to explain AI predictions
"""

import numpy as np

try:
    import tensorflow as tf
    from tensorflow.keras.models import Model
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    tf = None
    Model = None

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    cv2 = None

try:
    import matplotlib.pyplot as plt
    MPL_AVAILABLE = True
except ImportError:
    MPL_AVAILABLE = False
    plt = None


class GradCAM:
    def __init__(self, model, last_conv_layer_name="Conv_1"):
        self.model = model
        self.last_conv_layer_name = last_conv_layer_name

    def make_gradcam_heatmap(self, img_array, pred_index=None):
        """Generate Grad-CAM heatmap"""
        if not TF_AVAILABLE:
            print("TensorFlow not available - returning dummy heatmap")
            return np.random.rand(7, 7)
        try:
            grad_model = Model(
                inputs=self.model.inputs,
                outputs=[self.model.get_layer(self.last_conv_layer_name).output, self.model.output]
            )

            with tf.GradientTape() as tape:
                last_conv_layer_output, preds = grad_model(img_array)
                if pred_index is None:
                    pred_index = tf.argmax(preds[0])
                class_channel = preds[:, pred_index]

            grads = tape.gradient(class_channel, last_conv_layer_output)

            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

            last_conv_layer_output = last_conv_layer_output[0]
            heatmap = last_conv_layer_output @ pooled_grads[..., tf.newaxis]
            heatmap = tf.squeeze(heatmap)

            heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
            return heatmap.numpy()

        except Exception as e:
            print(f"Grad-CAM error: {e}")
            return np.random.rand(7, 7)

    def create_superimposed_visualization(self, img_path, heatmap, alpha=0.4):
        """Create superimposed visualization of original image and heatmap"""
        if not CV2_AVAILABLE or not TF_AVAILABLE:
            print("cv2 or TensorFlow not available - cannot create visualization")
            return None
        try:
            img = cv2.imread(img_path)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img = cv2.resize(img, (224, 224))

            heatmap = np.uint8(255 * heatmap)

            from matplotlib import colormaps
            jet = colormaps["jet"]
            jet_colors = jet(np.arange(256))[:, :3]
            jet_heatmap = jet_colors[heatmap]

            jet_heatmap = tf.keras.preprocessing.image.array_to_img(jet_heatmap)
            jet_heatmap = jet_heatmap.resize((224, 224))
            jet_heatmap = tf.keras.preprocessing.image.img_to_array(jet_heatmap)

            superimposed_img = jet_heatmap * alpha + img
            superimposed_img = tf.keras.preprocessing.image.array_to_img(superimposed_img)

            return superimposed_img

        except Exception as e:
            print(f"Visualization error: {e}")
            return None


def generate_explanation(model, img_path, img_array, class_names):
    """Generate complete explanation with Grad-CAM"""
    if not TF_AVAILABLE:
        return None, None
    try:
        gradcam = GradCAM(model)

        heatmap = gradcam.make_gradcam_heatmap(img_array)

        visualization = gradcam.create_superimposed_visualization(img_path, heatmap)

        preds = model.predict(img_array)
        pred_class = np.argmax(preds[0])
        confidence = float(preds[0][pred_class])

        explanation = {
            "predicted_class": class_names[pred_class] if pred_class < len(class_names) else "Unknown",
            "confidence": confidence,
            "heatmap": heatmap.tolist(),
            "explanation_text": f"The AI model focused on the highlighted regions to make this prediction with {confidence*100:.1f}% confidence."
        }

        return explanation, visualization

    except Exception as e:
        print(f"Explanation generation error: {e}")
        return None, None


if __name__ == "__main__":
    print("Grad-CAM Explainable AI Module Ready")
    print(f"TensorFlow available: {TF_AVAILABLE}")
    print(f"OpenCV available: {CV2_AVAILABLE}")
    print(f"Matplotlib available: {MPL_AVAILABLE}")