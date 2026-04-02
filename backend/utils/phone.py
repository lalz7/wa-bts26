def normalize_number(number):

    number = str(number).strip()

    number = number.replace(" ", "")
    number = number.replace("-", "")
    number = number.replace("+", "")

    if number.startswith("08"):
        number = "62" + number[1:]

    elif number.startswith("8"):
        number = "62" + number

    elif number.startswith("620"):
        number = "62" + number[3:]

    return number