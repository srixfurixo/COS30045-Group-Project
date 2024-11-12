import pandas as pd
import re

# Load the dataset
data = pd.read_csv(r'Datasets\story5.csv')

# Try converting 'Day' to datetime to extract year, without overwriting original column
data['Parsed_Date'] = pd.to_datetime(data['Day'], errors='coerce')

# Use the parsed date where it’s valid to populate the 'Year' column
data['Year'] = data['Parsed_Date'].dt.year

# For rows where 'Parsed_Date' is NaT (conversion failed), extract the year manually using regex
data['Year'] = data['Year'].combine_first(
    data['Day'].apply(lambda x: int(re.search(r'\b(20\d{2})\b', x).group(1)) if pd.notna(x) and re.search(r'\b(20\d{2})\b', x) else None)
)

# Drop the temporary 'Parsed_Date' column, as it's no longer needed
data = data.drop(columns=['Parsed_Date'])

# Save the modified dataset with the new 'Year' column
output_path = r'Datasets\story5_with_year.csv'
data.to_csv(output_path, index=False)
print(f"Process complete. The file '{output_path}' has been saved locally.")
