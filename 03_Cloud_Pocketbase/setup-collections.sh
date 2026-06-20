#!/bin/sh
# 灾备：若数据卷丢失，重建 users.tier + charts 集合（先建超管，改下方账号/密码/HOST）
H="${1:-guanji-cloud.fly.dev}"; EMAIL="$2"; PASS="$3"
TOK=$(curl -s -X POST "https://$H/api/collections/_superusers/auth-with-password" -H "Content-Type: application/json" -d "{\"identity\":\"$EMAIL\",\"password\":\"$PASS\"}" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s -X PATCH "https://$H/api/collections/_pb_users_auth_" -H "Authorization: $TOK" -H "Content-Type: application/json" -d '{"fields":[{"name":"tier","type":"select","maxSelect":1,"values":["free","pro","vip"]}]}' >/dev/null
R='@request.auth.id != "" && owner = @request.auth.id'
python3 -c "import json;print(json.dumps({'name':'charts','type':'base','fields':[{'name':'cid','type':'text','required':True},{'name':'owner','type':'relation','required':True,'collectionId':'_pb_users_auth_','cascadeDelete':True,'maxSelect':1},{'name':'data','type':'json','maxSize':200000},{'name':'cupd','type':'number'},{'name':'deleted','type':'bool'}],'listRule':'$R','viewRule':'$R','createRule':'$R','updateRule':'$R','deleteRule':'$R'}))" > /tmp/c.json
curl -s -X POST "https://$H/api/collections" -H "Authorization: $TOK" -H "Content-Type: application/json" --data-binary @/tmp/c.json | python3 -c "import sys,json;print('charts:',json.load(sys.stdin).get('id','ERR'))"
