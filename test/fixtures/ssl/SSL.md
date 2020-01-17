# About these certificates/keys

These certs are merely used in unit tests. In case that a cert ever has to be regenerated, it can be achieved like this.
All Keys have the passphrase 'password'.

## Generate a CSR from a private key

`openssl req -new -key server.key -out server.csr`

## Sign the CSR with the CA

`openssl x509 -req -days 10000 -in server.csr -CA ca.crt -CAkey ca.key -out server.crt -set_serial 1 -outform pem -extfile v3.ext -sha256`
