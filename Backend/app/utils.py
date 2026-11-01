import re
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

MONEY_QUANTUM = Decimal("0.01")
MAX_TRANSACTION_AMOUNT = Decimal("9999999999.99")


def next_transaction_id(last_id: str | None) -> str:
    """WB0000001, WB0000002, ... auto-generated, never reused."""
    if not last_id:
        return "WB0000001"
    match = re.fullmatch(r"WB(\d+)", last_id)
    if not match:
        raise ValueError(f"Invalid transaction ID format: {last_id!r}")
    n = int(match.group(1)) + 1
    return f"WB{n:07d}"


def parse_transaction_amount(value) -> Decimal:
    """Parse and validate a positive currency amount with at most two decimals."""
    if isinstance(value, bool) or value is None:
        raise ValueError("amount must be a positive number")
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise ValueError("amount must be a positive number") from None
    if not amount.is_finite() or amount <= 0:
        raise ValueError("amount must be a positive number")
    try:
        rounded = amount.quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)
    except InvalidOperation:
        raise ValueError("amount is outside the supported range") from None
    if rounded != amount:
        raise ValueError("amount must have no more than two decimal places")
    if rounded > MAX_TRANSACTION_AMOUNT:
        raise ValueError("amount exceeds the supported maximum")
    return rounded


def apply_tax(amount, tax_rate: float):
    """Returns (tax_amount, amount_after_tax) rounded to 2dp."""
    amount = Decimal(str(amount))
    rate = Decimal(str(tax_rate))
    tax_amount = (amount * rate).quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)
    amount_after_tax = (amount - tax_amount).quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)
    return tax_amount, amount_after_tax
