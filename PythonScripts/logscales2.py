import pandas as pd
import numpy as np

# Load the dataset
file_path = 'Datasets\story2.csv'  # Replace with your actual file path
data = pd.read_csv(file_path)

# Replace 'OBS_VALUE' column with its logarithmic transformation
data['OBS_VALUE'] = np.log(data['OBS_VALUE'] + 1)  # Add 1 to handle any zero values

# Save the transformed data to a new file
output_file_path = 'Datasets\story2log.csv'
data.to_csv(output_file_path, index=False)

# Optionally, display a message indicating where the file was saved
print(f"Transformed data saved to {output_file_path}")
