import pandas as pd

# Step 1: Load the dataset
file_path = 'Complete_Data_With_Month.csv'  # Replace with the actual path to your CSV file
df = pd.read_csv(file_path)

# Step 2: Filter the rows where any field contains 'COVID'
df_covid = df[df.apply(lambda row: row.astype(str).str.contains('COVID', case=False, na=False).any(), axis=1)]

# Step 3: Save the filtered data to a new CSV file (optional)
df_covid.to_csv('filtered_covid_data.csv', index=False)

# Step 4: Display the filtered data (first few rows)
print(df_covid.head())
