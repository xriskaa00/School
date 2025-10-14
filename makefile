all: keyfilter

.PHONY: all run clean

keyfilter: keyfilter.c
	clang -std=c11 -Wall -Wextra -Werror keyfilter.c -o keyfilter

run: keyfilter
	./keyfilter

clean:
	rm keyfilter