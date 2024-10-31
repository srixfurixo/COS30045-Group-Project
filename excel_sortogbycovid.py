import pandas as pd

file_path = 'Complete_Data_With_Month.csv'  # Replace with the actual path to your CSV file
df = pd.read_csv(file_path)

df_covid = df[df.apply(lambda row: row.astype(str).str.contains('COVID', case=False, na=False).any(), axis=1)]

df_covid.to_csv('filtered_covid_data.csv', index=False)

print(df_covid.head())
