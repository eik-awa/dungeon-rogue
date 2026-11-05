#!/bin/sh
# AdLoadPolicy.swift の単体検証(SDK 不要)。リポジトリのルートに何も作らないよう、一時ディレクトリでビルドする。
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$(mktemp -d)"
swiftc "$DIR/../../rogue-like-dungeon/AdLoadPolicy.swift" "$DIR/main.swift" -o "$OUT/policy_test"
"$OUT/policy_test"
