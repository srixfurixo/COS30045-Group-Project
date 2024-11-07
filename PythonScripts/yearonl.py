import pandas as pd

# Load the cumulative COVID-19 vaccination data
vaccinations_df = pd.read_csv('COS30045-Group-Project\Datasets\cumulative-covid-vaccinations.csv')

# Extract only the year from the 'Year' column
vaccinations_df['Year'] = pd.to_datetime(vaccinations_df['Year']).dt.year

# Save the updated dataframe to a new CSV file
output_path = 'cumulative_covid_vaccinations_with_year_only.csv'
vaccinations_df.to_csv(output_path, index=False)

print(f"Updated data saved to {output_path}")
