#include "types.h"
#include <stdio.h>

/**
 * Funkce provede výpočet `dividend / divisor`.
 * Výsledek vrací prostřednictvím ukazatele `quotient`.
 *
 * Funkce nic netiskne!
 *
 * @param dividend  Dělenec
 * @param divisor   Dělitel
 * @param quotient  Ukazatel na podíl/kvocient (výsledek)
 *
 * @returns hodnotu true při úspěšném dělení, false jinak
 */
bool divide(int dividend, int divisor, double *quotient)
{
    // TODO: Implementujte správné desetinné dělení
    // TODO: Výsledek vraťte prostřednictvím parametru quotient
    if (divisor == 0) {
        return false;
    }
    *quotient = (double)dividend / divisor;
    return true;
}

#ifndef TEST_BUILD

int main(int argc, char *argv[])
{
    int dividend, divisor;
    double quotient;

    // načtení dělence a dělitele ze stdin
    scanf("%d", &dividend);
    scanf("%d", &divisor);

    // TODO: Zavolejte funkci divide s odpovídajícími parametry

    // TODO: Ošetřete případné chybné zpracování,
    //   v případě chyby, vypiště "divide: error" na stdout
    if (!divide(dividend, divisor, &quotient)) {
        printf("divide: error\n");
        return 1;
    }

    // výpis výsledku dělení
    printf("%.3f\n", quotient);

    return 0;
}

#endif
