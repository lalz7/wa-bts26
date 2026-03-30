import pandas as pd


def read_excel(file):

    df = pd.read_excel(file)

    data = []

    for _, row in df.iterrows():

        data.append({
            "id": int(row["id"]),
            "nama": str(row["nama"]),
            "kelas": str(row["kelas"]),
            "no_hp": str(row["no_hp"])
        })

    return data