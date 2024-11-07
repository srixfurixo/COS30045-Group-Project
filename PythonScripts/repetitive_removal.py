import pandas as pd

# Load the combined dataset
data_path = 'COS30045-Group-Project\\Datasets\\combined_population_vaccination.csv'
df = pd.read_csv(data_path)

# Group by 'Country' and 'Year' and take the mean of numeric columns
df_averaged = df.groupby(['Country', 'Year'], as_index=False).mean()

# Save the result to a new CSV file
output_path = 'COS30045-Group-Project\\Datasets\\combined_population_vaccination_averaged.csv'
df_averaged.to_csv(output_path, index=False)

print(f"Averaged data saved to {output_path}")
