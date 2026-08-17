-- Make User.mobile unique so mobile numbers can be used as login usernames.
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");
