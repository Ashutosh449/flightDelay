#!/bin/bash

CHAIN=${1:-kovan}
KEYS_PATH=`pwd`/env/keys/
PASSWORD=`pwd`/env/keys/`echo $CHAIN`.txt

parity \
--author 0xc3878b8566f5626fb8d6ad43b647e3405668f20b \
--unlock 0xc3878b8566f5626fb8d6ad43b647e3405668f20b,\
0x1d45c059e511241a5c1b3081e56302a59621c94c,\
0x79e3c795890175180c492b66b69f0d35ff031de4,\
0xa3a645c963ca4c03328afbd9a79f45716b492231,\
0x6e5dc1285a441627c0046604586b081bbe41fbc8,\
0x189a99226ad233df825cc1f9d48c8afba529b803,\
0x5226d6ce4d0b84ec9f8214ee4f5883738dad130e,\
0x1885bf0a04c6948061007cb556935a903b1bed95,\
0xd3ce03dfcc6b95c55f991b989b48bff28a9f3962,\
0xc95efc83de5832510dac2c29198279eb8662d77e \
--password=$PASSWORD \
--keys-path=$KEYS_PATH \
--mode active \
--force-ui \
--geth \
--chain $CHAIN
