import pandas as pd

# Load the main dataset (Total ICU Beds) and the occupancy dataset with specified encoding
main_data = pd.read_csv(r'C:/Users/FuriAlphaV2/Desktop/DataVis-GroupProj/COS30045-Group-Project/Datasets/total_icu_beds.csv', encoding='ISO-8859-1')
occupancy_data = pd.read_csv(r'C:/Users/FuriAlphaV2/Desktop/DataVis-GroupProj/COS30045-Group-Project/Datasets/occup.csv', encoding='ISO-8859-1')

# Rename columns in occupancy data for easier merging
occupancy_data = occupancy_data.rename(columns={'Reference area': 'Country', 'TIME_PERIOD': 'Year', 'OBS_VALUE': 'Occupancy_Rate'})

# Ensure Year column types match in both dataframes (convert to integers if necessary)
main_data['Year'] = main_data['Year'].astype(int)
occupancy_data['Year'] = occupancy_data['Year'].astype(int)

# Merge the datasets on 'Country' and 'Year'
merged_data = pd.merge(main_data, occupancy_data[['Country', 'Year', 'Occupancy_Rate']], on=['Country', 'Year'], how='left')

# Save the merged dataset in the current directory, maintaining the format of the main dataset
merged_data.to_csv(r'C:/Users/FuriAlphaV2/Desktop/DataVis-GroupProj/COS30045-Group-Project/Datasets/merged_total_icu_beds_with_occupancy.csv', index=False)

print("Merge complete. The merged data has been saved as 'merged_total_icu_beds_with_occupancy.csv'.")
