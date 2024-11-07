import pandas as pd
import numpy as np

# Paths to your input files, corrected with raw string literals
top_5_path = r'COS30045-Group-Project\Datasets\filtered_vaccine_data_top_5_latest.csv'
bottom_5_path = r'COS30045-Group-Project\Datasets\filtered_vaccine_data_bottom_5_latest.csv'

# Load the datasets
top_5_df = pd.read_csv(top_5_path)
bottom_5_df = pd.read_csv(bottom_5_path)

# Define a function to apply logarithmic scaling
def apply_log_scaling(df):
    df_log_scaled = df.copy()
    for col in df.columns[2:]:  # Skip 'country' and 'date' columns
        df_log_scaled[col] = np.log1p(df[col])  # log1p(x) = log(1 + x)
    return df_log_scaled

# Apply the function to both datasets
top_5_log_scaled = apply_log_scaling(top_5_df)
bottom_5_log_scaled = apply_log_scaling(bottom_5_df)

# Save the transformed data to new CSV files
top_5_log_scaled_path = r'log_scaled_vaccine_data_top_5.csv'
bottom_5_log_scaled_path = r'log_scaled_vaccine_data_bottom_5.csv'
top_5_log_scaled.to_csv(top_5_log_scaled_path, index=False)
bottom_5_log_scaled.to_csv(bottom_5_log_scaled_path, index=False)

print(f"Logarithmically scaled data saved to {top_5_log_scaled_path} and {bottom_5_log_scaled_path}")
