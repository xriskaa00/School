#include "types.h"
#include <stdio.h>

/**
 * Funkce vymění hodnoty dvou celočíselných proměnných.
 */
void swapInts(int *variableA, int *variableB)
{
    // TODO: 1. implementujte metodu dle zadání
    int tmp = *variableA;
    *variableA = *variableB;
    *variableB = tmp;
}

#ifndef TEST_BUILD

int main(int argc, char *argv[])
{
    int number1, number2;

    // načtení čísel ze stdin
    scanf("%d", &number1);
    scanf("%d", &number2);

    swapInts(&number1, &number2);
    printf("%d %d\n", number1, number2);

    return 0;
}

#endif
