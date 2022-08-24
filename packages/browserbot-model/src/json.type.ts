export type Json =
    | string
    | number
    | boolean
    | { [x: string]: Json }
    | Array<Json>;
