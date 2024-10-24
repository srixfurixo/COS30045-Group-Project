import pandas as pd

# Step 1: Load the dataset
file_path = 'filtered_covid_data.csv'  # Replace with the actual path to your CSV file
df = pd.read_csv(file_path)

# Step 2: Remove rows where the specified text is found
df_cleaned = df[~df.apply(lambda row: row.astype(str).str.contains('COVID-19 deaths \\(% of All-cause deaths\\)', case=False, na=False).any(), axis=1)]

# Step 3: Save the cleaned data to a new CSV file (optional)
df_cleaned.to_csv('cleaned_data_no_covid_deaths_percent.csv', index=False)

# Step 4: Display the cleaned data (first few rows)
print(df_cleaned.head())
