#steps of registration

1. Destruct the email from payload(model) and check if user email already exists or not, if user exits(throw new error "email already taken")
2. hash the text password
3. register the user into database(model.create(rest))
4. generate otp and update user model with token
5. send otp to user email

#steps of login

1 destruct the email and password from payload(model)
2.user find using email + is blocked ? isAcive
3.compare password withh db stored pw.
4.generate token and return token
