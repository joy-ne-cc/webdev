from flask import Flask, request

app = Flask(__name__)

transactions = []

booths = {
    "Wina1": "Lusaka CBD",
    "Wina2": "Libala",
    "Wina3": "Kabwata",
    "Wina4": "Mandevu",
    "Wina5": "Woodlands",
    "Wina6": "Matero East"
}

services = {
    "Wina1": ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"],
    "Wina2": ["Airtel Money", "MTN Money", "Zamtel Money", "FNB"],
    "Wina3": ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"],
    "Wina4": ["Airtel Money", "MTN Money", "Zamtel Money"],
    "Wina5": ["Airtel Money", "MTN Money", "Zanaco", "FNB"],
    "Wina6": ["Airtel Money", "MTN Money", "Zamtel Money"]
}

@app.route("/")
def home():

    page = """
    <h1>Wina Bwangu Transactions</h1>

    <form method="POST" action="/add">

    Booth:
    <select name="booth">
        <option>Wina1</option>
        <option>Wina2</option>
        <option>Wina3</option>
        <option>Wina4</option>
        <option>Wina5</option>
        <option>Wina6</option>
    </select>

    <br><br>

    Service:
    <input name="service">

    <br><br>

    Amount:
    <input name="amount">

    <br><br>

    <button type="submit">
    Save Transaction
    </button>

    </form>

    <hr>

    <h2>Transactions</h2>
    """

    for t in transactions:
        page += f"""
        <p>
        {t['id']} |
        {t['booth']} |
        {t['service']} |
        K{t['amount']}
        </p>
        """

    return page


@app.route("/add", methods=["POST"])
def add():

    transaction_id = "TRX" + str(len(transactions)+1)

    transaction = {
        "id": transaction_id,
        "booth": request.form["booth"],
        "service": request.form["service"],
        "amount": request.form["amount"]
    }

    transactions.append(transaction)

    return f"""
    <h2>Transaction Saved</h2>

    ID: {transaction_id}<br>
    Booth: {transaction['booth']}<br>
    Service: {transaction['service']}<br>
    Amount: {transaction['amount']}<br><br>

    <a href="/">Back</a>
    """


@app.route("/transactions")
def get_transactions():
    return {"transactions": transactions}


if __name__ == "__main__":
    app.run(debug=True)