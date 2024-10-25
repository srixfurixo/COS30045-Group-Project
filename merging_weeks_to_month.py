import pandas as pd

# Load the CSV file
file_path = 'merged_data_with_expenditure_corrected.csv'  # Replace with your file path
try:
    df = pd.read_csv(file_path)
    print("CSV file loaded successfully!")
except FileNotFoundError:
    print(f"Error: The file at {file_path} was not found.")
    exit()

# Group the data by Year, Month, and Country, and sum the Deaths for each group.
df_grouped = df.groupby(['Year', 'Month', 'Country'], as_index=False).agg({
    'Deaths': 'sum',
    'Expenditure': 'mean'  # Assuming you want to keep the expenditure as the mean for each month
})

# Save the modified CSV to a new file
output_path = 'cleaned_data_monthly_deaths.csv'
df_grouped.to_csv(output_path, index=False)

print(f"Aggregated data saved to {output_path}")
