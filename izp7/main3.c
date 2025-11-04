#include "types.h"
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

#ifndef TEST_BUILD
int main(int argc, char *argv[])
{
    // TODO: volejte vámi implementované funkce
    return 0;
}
#endif

void vector_print(Vector *v)
{
    if (v == NULL || v->items == NULL) {
        printf("Vector(0) = (null)\n");
        return;
    }

    printf("Vector(%d) = [", v->size);
    for (int i = 0; i < v->size; i++) {
        printf("%d", v->items[i]);
        if (i < v->size - 1) {
            printf(", ");
        }
    }
    printf("]\n");
}

bool vector_ctor(Vector *v, unsigned int size)
{
    if (v == NULL) {
        return false;
    }

    v->size = size;
    if (size == 0) {
        v->items = NULL;
        return true;
    }

    v->items = (int *)malloc(sizeof(int) * size);
    if (v->items == NULL) {
        return false;
    }

    return true;
}

void vector_init(Vector *v)
{
    if (v == NULL || v->items == NULL) {
        return;
    }

    for (int i = 0; i < v->size; i++) {
        v->items[i] = i;
    }
}

void vector_dtor(Vector *v)
{
    if (v == NULL || v->items == NULL) {
        return;
    }

    free(v->items);
    v->items = NULL;
    v->size = 0;
}

void vector_scalar_multiply(Vector *v, int scalar)
{
    if (v == NULL || v->items == NULL) {
        return;
    }

    for (int i = 0; i < v->size; i++) {
        v->items[i] *= scalar;
    }
}

bool vector_add(Vector *v1, Vector *v2)
{
    if (v1 == NULL || v2 == NULL || v1->items == NULL || v2->items == NULL) {
        return false;
    }
    if (v1->size != v2->size) {
        return false;
    }

    for (int i = 0; i < v1->size; i++) {
        v1->items[i] += v2->items[i];
    }
    return true;
}

bool vector_sub(Vector *v1, Vector *v2)
{
    if (v1 == NULL || v2 == NULL || v1->items == NULL || v2->items == NULL) {
        return false;
    }
    if (v1->size != v2->size) {
        return false;
    }

    for (int i = 0; i < v1->size; i++) {
        v1->items[i] -= v2->items[i];
    }
    return true;
}
