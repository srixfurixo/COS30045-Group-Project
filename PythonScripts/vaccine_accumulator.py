import pandas as pd

# Load the vaccination data from CSV file
file_path = r'C:\Users\FuriAlphaV2\Desktop\DataVis-GroupProj\COS30045-Group-Project\Datasets\filtered_vaccine_data.csv'  # Use raw string for Windows path

vaccine_data = pd.read_csv(file_path)

# Group by 'Country' and calculate the cumulative sum for each vaccine type
cumulative_vaccine_data = vaccine_data.groupby('Country').sum(numeric_only=True).reset_index()

# Save the cumulative data to a new CSV file
output_file = 'cumulative_vaccine_data.csv'
cumulative_vaccine_data.to_csv(output_file, index=False)

print(f"Cumulative data saved to {output_file}")
