import pandas as pd

# Load the vaccine doses dataset
vaccine_doses = pd.read_csv('COS30045-Group-Project\Datasets\covid-vaccine-doses-by-manufacturer.csv')

# Define the top 5 worst affected and top 5 least affected countries
top_5_worst_affected = ['United States', 'United Kingdom', 'Mexico', 'Italy', 'Germany']
top_5_least_affected = ['Iceland', 'Luxembourg', 'Norway', 'Denmark', 'Estonia']

# Step 1: Filter the vaccine doses data to include only the specified top 5 and bottom 5 countries
vaccine_doses_top_5 = vaccine_doses[vaccine_doses['Entity'].isin(top_5_worst_affected)]
vaccine_doses_bottom_5 = vaccine_doses[vaccine_doses['Entity'].isin(top_5_least_affected)]

# Step 2: Select the top 5 most popular vaccine manufacturers
selected_vaccine_columns = [
    'COVID-19 doses (cumulative) - Manufacturer Pfizer/BioNTech',
    'COVID-19 doses (cumulative) - Manufacturer Moderna',
    'COVID-19 doses (cumulative) - Manufacturer Oxford/AstraZeneca',
    'COVID-19 doses (cumulative) - Manufacturer Johnson&Johnson',
    'COVID-19 doses (cumulative) - Manufacturer Sputnik V'
]

# Step 3: Filter the vaccine doses data to include only these selected manufacturers
vaccine_doses_top_5 = vaccine_doses_top_5[['Entity', 'Day'] + selected_vaccine_columns]
vaccine_doses_bottom_5 = vaccine_doses_bottom_5[['Entity', 'Day'] + selected_vaccine_columns]

# Rename columns for clarity
vaccine_doses_top_5.columns = ['Country', 'Date', 'Pfizer/BioNTech', 'Moderna', 'Oxford/AstraZeneca', 'Johnson&Johnson', 'Sputnik V']
vaccine_doses_bottom_5.columns = ['Country', 'Date', 'Pfizer/BioNTech', 'Moderna', 'Oxford/AstraZeneca', 'Johnson&Johnson', 'Sputnik V']

# Save each filtered dataset to separate CSV files
vaccine_doses_top_5.to_csv('filtered_vaccine_data_top_5_countries.csv', index=False)
vaccine_doses_bottom_5.to_csv('filtered_vaccine_data_bottom_5_countries.csv', index=False)

print("Filtered data for top 5 worst affected countries saved to 'filtered_vaccine_data_top_5_countries.csv'")
print("Filtered data for top 5 least affected countries saved to 'filtered_vaccine_data_bottom_5_countries.csv'")
print(f"Top 5 worst affected countries: {top_5_worst_affected}")
print(f"Top 5 least affected countries: {top_5_least_affected}")
