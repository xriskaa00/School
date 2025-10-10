# Makefile pre jednoduchú kompiláciu a spustenie

all: main

main: main.c
	gcc main.c -std=c11 -Wall -Wextra -o main

run: main
	./main
