import pandas as pd
import datetime as dt

file_path = 'OECD.ELS.HD,DSD_HEALTH_MORTALITY@DF_MORTALITY_COVID,1.0+.W.MCVD19._T._T..csv'
df = pd.read_csv(file_path)

def week_to_month(week_str):
    try:
        year, week = week_str.split('-W')
        year = int(year)
        week = int(week)
        first_day_of_week = dt.datetime.strptime(f'{year}-W{week}-1', "%Y-W%U-%w")
        return first_day_of_week.strftime('%Y-%m')
    except Exception:
        return None

df['Month'] = df['TIME_PERIOD'].apply(week_to_month)
df_sorted = df.sort_values(by='Reference area')
df_sorted.to_csv('sorted_by_month_and_country.csv', index=False)

print("sucesfull operation")
