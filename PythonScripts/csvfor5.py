import pandas as pd

# Load datasets with provided paths
monthly_deaths_df = pd.read_csv('COS30045-Group-Project\\Datasets\\cleaned_data_monthly_deaths.csv')
vaccinations_df = pd.read_csv('COS30045-Group-Project\\Datasets\\cumulative_covid_vaccinations_with_year_only.csv')
population_df = pd.read_csv('COS30045-Group-Project\\Datasets\\pop.csv')

# Step 1: Extract the list of unique countries from monthly deaths dataset
countries = monthly_deaths_df['Country'].unique()

# Step 2: Filter vaccinations and population dataframes to match these countries
vaccinations_filtered = vaccinations_df[vaccinations_df['Country'].isin(countries)]
population_filtered = population_df[population_df['Country'].isin(countries)]

# Step 3: Rename 'OBS_VALUE' columns for clarity
vaccinations_filtered = vaccinations_filtered.rename(columns={'OBS_VALUE': 'Cumulative_Vaccinations'})
population_filtered = population_filtered.rename(columns={'OBS_VALUE': 'Population'})

# Step 4: Merge vaccinations and population data based on 'Country' and 'Year'
merged_df = pd.merge(
    vaccinations_filtered[['Country', 'Year', 'Cumulative_Vaccinations']],
    population_filtered[['Country', 'Year', 'Population']],
    on=['Country', 'Year'],
    how='inner'
)

# Step 5: Save the result to a new CSV file
output_path = 'COS30045-Group-Project\\Datasets\\combined_population_vaccination.csv'
merged_df.to_csv(output_path, index=False)

print(f"Combined data saved to {output_path}")
