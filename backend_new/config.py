import os

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'wina_bwangu.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ASSUMPTION: the case study asks the app to "calculate Transaction Amount
    # after Tax" but never states a rate. 10% is a placeholder — change this
    # to whatever rate your lecturer/brief specifies, or make it configurable
    # per-service if the real brief needs that.
    TAX_RATE = float(os.environ.get("TAX_RATE", 0.10))
