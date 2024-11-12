import pandas as pd

# Load the datasets
vaccine_data = pd.read_csv(r'Datasets\s5vaccine.csv')
monthly_deaths = pd.read_csv(r'Datasets\cleaned_data_monthly_deaths.csv')

# Extract the list of unique countries in the monthly deaths dataset
countries_in_monthly_deaths = monthly_deaths['Country'].unique()

# Filter the vaccine data to include only countries present in the monthly deaths data
filtered_vaccine_data = vaccine_data[vaccine_data['Country'].isin(countries_in_monthly_deaths)]

# Save the filtered vaccine data to a new CSV file
filtered_vaccine_data.to_csv('Datasets\story5.csv', index=False)

print("Filtering complete. The filtered vaccine data has been saved as 'filtered_vaccine_data.csv'.")
