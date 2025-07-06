fn main(secret_id: Field) -> pub Field {
    let mut valid = 0;

    if secret_id == 123 {
        valid = 1;
    }
    if secret_id == 456 {
        valid = 1;
    }
    if secret_id == 789 {
        valid = 1;
    }

    assert(valid == 1);
    1
}