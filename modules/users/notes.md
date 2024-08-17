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

#steps for genForgetPasswordToken

1.check email for user; isBlocked? , isActive?
2.generate new token(otp)
2.send token to user in email
3.store token in database in user data 5.

#steps for verifyForgetPasswordToken
1.check email for user ; isBlocked? , isActive?
2.check token for user
3.token match; newPassword hash
4.update user data in database with hash and empty token field

#steps for changing password
1.check email for user ; isBlocked? , isActive?
2.compare the old password stored in db
3.generate hash of newPassword
4.update the user data with newPassword
