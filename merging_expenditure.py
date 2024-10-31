import pandas as pd

cleaned_data_path = 'cleaned_data_no_covid_deaths_percent.csv'  
expenditure_data_path = 'health_expenditure.csv'  

df_cleaned = pd.read_csv(cleaned_data_path)
df_expenditure = pd.read_csv(expenditure_data_path)

# Step 2: Rename the 'Reference area' column in the expenditure dataset to 'Country' for consistency
df_expenditure.rename(columns={'Reference area': 'Country'}, inplace=True)

# Step 3: Select relevant columns from the expenditure dataset
# Assuming the expenditure data has 'OBS_VALUE' for expenditure amount and 'TIME_PERIOD' for the year
df_expenditure = df_expenditure[['Country', 'OBS_VALUE', 'TIME_PERIOD']]  # Ensure 'TIME_PERIOD' is the year

# Step 4: Ensure 'TIME_PERIOD' is treated as a string in both datasets
df_cleaned['TIME_PERIOD'] = df_cleaned['TIME_PERIOD'].astype(str)
df_expenditure['TIME_PERIOD'] = df_expenditure['TIME_PERIOD'].astype(str)

# Step 5: Extract year from 'TIME_PERIOD' in the cleaned data
df_cleaned['Year'] = df_cleaned['TIME_PERIOD'].apply(lambda x: x.split('-')[0])  # Extract year from 'TIME_PERIOD'

# Step 6: Merge the datasets on 'Country' and 'Year' columns
df_merged = pd.merge(df_cleaned, df_expenditure, left_on=['Country', 'Year'], right_on=['Country', 'TIME_PERIOD'], how='left')

# Step 7: Fill the expenditure value across all rows for the same country and year (weekly data)
df_merged['OBS_VALUE_y'] = df_merged.groupby(['Country', 'Year'])['OBS_VALUE_y'].transform('first')

# Step 8: Save the merged dataset to a new CSV file
df_merged.to_csv('merged_data_with_expenditure_corrected.csv', index=False)

# Step 9: Display the first few rows of the merged dataset to verify
print(df_merged.head())
