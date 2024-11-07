import pandas as pd

# Load the datasets
monthly_deaths = pd.read_csv('COS30045-Group-Project\Datasets\cleaned_data_monthly_deaths.csv')
vaccine_doses = pd.read_csv('COS30045-Group-Project\Datasets\covid-vaccine-doses-by-manufacturer.csv')

# Step 1: Identify the countries in the cleaned_data_monthly_deaths CSV
unique_countries = monthly_deaths['Country'].unique()

# Step 2: Filter the vaccine doses data to only include rows where the country matches those in the monthly_deaths file
vaccine_doses_filtered = vaccine_doses[vaccine_doses['Entity'].isin(unique_countries)]

# Step 3: Select the top 5 most popular vaccine manufacturers based on availability in the dataset
# Specify the selected vaccine columns
selected_vaccine_columns = [
    'COVID-19 doses (cumulative) - Manufacturer Pfizer/BioNTech',
    'COVID-19 doses (cumulative) - Manufacturer Moderna',
    'COVID-19 doses (cumulative) - Manufacturer Oxford/AstraZeneca',
    'COVID-19 doses (cumulative) - Manufacturer Johnson&Johnson',
    'COVID-19 doses (cumulative) - Manufacturer Sputnik V'
]

# Step 4: Filter the vaccine doses data to include only these selected manufacturers
vaccine_doses_filtered = vaccine_doses_filtered[['Entity', 'Day'] + selected_vaccine_columns]

# Rename columns for clarity
vaccine_doses_filtered.columns = ['Country', 'Date', 'Pfizer/BioNTech', 'Moderna', 'Oxford/AstraZeneca', 'Johnson&Johnson', 'Sputnik V']

# Save the filtered data to a new CSV file for further use
vaccine_doses_filtered.to_csv('filtered_vaccine_data.csv', index=False)

print("Filtered data saved to 'filtered_vaccine_data.csv'")
