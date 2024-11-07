import pandas as pd

# Paths to the input files, using raw strings to avoid escape sequence issues
top_5_path = r'COS30045-Group-Project/Datasets/filtered_vaccine_data_top_5_countries.csv'
bottom_5_path = r'COS30045-Group-Project/Datasets/filtered_vaccine_data_bottom_5_countries.csv'

# Load the datasets
top_5_df = pd.read_csv(top_5_path)
bottom_5_df = pd.read_csv(bottom_5_path)

# Check for required columns
required_columns = ['country', 'date']
for col in required_columns:
    if col not in top_5_df.columns or col not in bottom_5_df.columns:
        print(f"Error: Missing column '{col}' in one of the datasets.")
        exit()

# Function to filter each dataset, keeping only the latest row per country
def filter_latest_per_country(df):
    # Sort by country and date, then keep the last entry for each country
    df_sorted = df.sort_values(by=['country', 'date'], ascending=[True, True])
    df_filtered = df_sorted.groupby('country').tail(1)
    return df_filtered

# Apply the function to filter each dataset
top_5_latest = filter_latest_per_country(top_5_df)
bottom_5_latest = filter_latest_per_country(bottom_5_df)

# Paths to save the filtered datasets
top_5_latest_path = r'COS30045-Group-Project/Datasets/filtered_vaccine_data_top_5_latest.csv'
bottom_5_latest_path = r'COS30045-Group-Project/Datasets/filtered_vaccine_data_bottom_5_latest.csv'

# Save the filtered data to new CSV files
top_5_latest.to_csv(top_5_latest_path, index=False)
bottom_5_latest.to_csv(bottom_5_latest_path, index=False)

print("Filtered datasets saved successfully.")
