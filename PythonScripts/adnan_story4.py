import pandas as pd

icu_admissions = pd.read_csv(r'AdnanDataProcessing\weekly-icu-admissions-covid.csv')
hospital_admissions = pd.read_csv(r'AdnanDataProcessing\weekly-hospital-admissions-covid.csv')
mortality = pd.read_csv(r'AdnanDataProcessing\mortality.csv')



# Filter ICU admissions countries
icu_countries = icu_admissions['Country'].unique()

hospital_admissions_filtered = hospital_admissions[hospital_admissions['Country'].isin(icu_countries)].copy()

# Ensure dates are in datetime format
icu_admissions['Date'] = pd.to_datetime(icu_admissions['Date'])
hospital_admissions_filtered['Date'] = pd.to_datetime(hospital_admissions_filtered['Date'])

# Resample ICU and hospital admissions to weekly by summing every 7 days
icu_admissions_weekly = (
    icu_admissions.set_index('Date')
    .groupby('Country')
    .resample('W')
    .sum(numeric_only=True)
    .reset_index()
)

hospital_admissions_weekly = (
    hospital_admissions_filtered.set_index('Date')
    .groupby('Country')
    .resample('W')
    .sum(numeric_only=True)
    .reset_index()
)

mortality['Date'] = mortality['TIME_PERIOD'].apply(lambda x: pd.to_datetime(x + '-1', format='%Y-W%U-%w'))

mortality_weekly = (
    mortality.set_index('Date')
    .groupby('Country')
    .resample('W')
    .sum(numeric_only=True)
    .reset_index()
)

merged_admissions = pd.merge(
    icu_admissions_weekly,
    hospital_admissions_weekly,
    on=['Country', 'Date'],
    how='inner',
    suffixes=('_ICU', '_Hospital')
)

final_data = pd.merge(
    merged_admissions,
    mortality_weekly[['Country', 'Date', 'Mortality']],
    on=['Country', 'Date'],
    how='inner'
)

final_data.to_csv(r'AdnanDataProcessing\weekly_combined_admissions_mortality.csv', index=False)

print("Process complete. The final merged weekly dataset has been saved as 'weekly_combined_admissions_mortality.csv'.")
