#!/usr/bin/env sh

# generate/refresh certificates for server, ca and client

SERVER='server3'
CA='ca3'
CLIENT='client3'
ECHO='echo'

# generate a private key for the server
if [[ ! -f "$SERVER.key" ]]; then
    openssl genrsa -out $SERVER.key 2048
fi

# generate a CSR with the private key for the server
openssl req -new -key $SERVER.key \
    -config config.cnf \
    -days 9999 \
    -out $SERVER.csr

# generate a private key for the Certificate Authority
if [[ ! -f "$CA.key" ]]; then
    openssl genrsa -out $CA.key 2048
fi

# generate a certificate for the the CA
openssl req -new -x509 -key $CA.key \
    -config config.cnf \
    -days 9999 \
    -out $CA.crt

# generate the server certificate signed by the CA
openssl x509 -req -in $SERVER.csr \
    -CA $CA.crt \
    -CAkey $CA.key \
    -out $SERVER.crt \
    -set_serial 1 \
    -outform pem \
    -extfile v3.ext \
    -days 9999 \
    -sha256

# verify that the certificate was generated correctly
openssl verify -CAfile $CA.crt $SERVER.crt

# generate a private key for the client
if [[ ! -f "$CLIENT.key" ]]; then
    openssl genrsa -out $CLIENT.key 2048
fi

# generate a CSR with the private key for the client
openssl req -new -key $CLIENT.key \
    -config config.cnf \
    -days 9999 \
    -out $CLIENT.csr

# generate the client certificate sign by the CA
openssl x509 -req -in $CLIENT.csr \
    -CA $CA.crt \
    -CAkey $CA.key \
    -out $CLIENT.crt \
    -set_serial 1 \
    -outform pem \
    -extfile v3.ext \
    -days 9999 \
    -sha256

# verify that the certificate was generated correctly
openssl verify -CAfile $CA.crt $CLIENT.crt

# generate a private key for the echo fixture server
if [[ ! -f "$ECHO.key" ]]; then
    openssl genrsa -out $ECHO.key 2048
fi

# generate a CSR with the private key for the echo fixture server
openssl req -new -key $ECHO.key \
    -config config.cnf \
    -days 9999 \
    -out $ECHO.csr

# generate the echo fixture certificate signed by the existing root CA
# (ca.key is passphrase-protected with 'password', see SSL.md)
openssl x509 -req -in $ECHO.csr \
    -CA ca.crt \
    -CAkey ca.key \
    -passin pass:password \
    -out $ECHO.crt \
    -set_serial 3 \
    -outform pem \
    -extfile echo-v3.ext \
    -days 9999 \
    -sha256

# verify that the certificate was generated correctly
openssl verify -CAfile ca.crt $ECHO.crt
