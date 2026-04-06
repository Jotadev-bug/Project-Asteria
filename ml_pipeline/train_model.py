import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

def train_and_export_model():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "training_dataset.csv")
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}. Please run fetch_training_data.py first.")
        return

    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Features selected based on physical and orbital relevance
    # H (Absolute Magnitude), albedo are strongly correlated with composition
    # Orbital elements might have minor correlations (e.g. asteroid families)
    features = ['H', 'albedo', 'e', 'a', 'q', 'i']
    target = 'target_class'
    
    # Drop any remaining NaNs in features
    df = df.dropna(subset=features + [target])
    
    X = df[features]
    y = df[target]
    
    print(f"Training data size: {len(X)} samples")
    print("Class distribution:")
    print(y.value_counts())
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("\nTraining RandomForestClassifier...")
    clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, class_weight='balanced')
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    
    print(f"\nModel Accuracy: {acc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Export model
    models_dir = os.path.join(os.path.dirname(__file__), "..", "backend", "models")
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, "asteroid_classifier.joblib")
    
    joblib.dump(clf, model_path)
    print(f"\nModel exported successfully to {model_path}")
    
    # Also save feature names to ensure the API matches them
    features_path = os.path.join(models_dir, "model_features.json")
    pd.Series(features).to_json(features_path, orient='records')

if __name__ == "__main__":
    train_and_export_model()
