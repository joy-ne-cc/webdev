from decimal import Decimal, ROUND_HALF_UP


def next_transaction_id(last_id: str | None) -> str:
    """WB0000001, WB0000002, ... auto-generated, never reused."""
    if not last_id:
        return "WB0000001"
    n = int(last_id.replace("WB", "")) + 1
    return f"WB{n:07d}"


def apply_tax(amount, tax_rate: float):
    """Returns (tax_amount, amount_after_tax) rounded to 2dp."""
    amount = Decimal(str(amount))
    rate = Decimal(str(tax_rate))
    tax_amount = (amount * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    amount_after_tax = (amount - tax_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return tax_amount, amount_after_tax
