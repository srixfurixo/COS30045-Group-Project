import pandas as pd
import datetime as dt

# Step 1: Load the dataset
file_path = 'OECD.ELS.HD,DSD_HEALTH_MORTALITY@DF_MORTALITY_COVID,1.0+.W.MCVD19._T._T..csv'  # Replace with the actual path to your CSV file
df = pd.read_csv(file_path)

# Step 2: Define a function to convert weekly periods to monthly periods
def week_to_month(week_str):
    try:
        year, week = week_str.split('-W')
        year = int(year)
        week = int(week)

        # Get the first day of the week
        first_day_of_week = dt.datetime.strptime(f'{year}-W{week}-1', "%Y-W%U-%w")

        # Convert to month (taking the month of the first day of the week)
        return first_day_of_week.strftime('%Y-%m')
    except Exception:
        return None

# Step 3: Apply the function to create a new 'Month' column
df['Month'] = df['TIME_PERIOD'].apply(week_to_month)

# Step 4: Sort the dataframe by 'Reference area' (country)
df_sorted = df.sort_values(by='Reference area')

# Step 5: Save the updated dataframe to a new CSV file (optional)
df_sorted.to_csv('sorted_by_month_and_country.csv', index=False)

# Step 6: Display the sorted data (first few rows) to verify
print(df_sorted[['Reference area', 'TIME_PERIOD', 'Month', 'OBS_VALUE']].head())
