:- use_module(library(persistency)).

:- persistent fact(fact1:any, fact2:any).
:- persistent mark(fact1:any, fact2:any, fact3:any).
:- persistent model(fact1:any, fact2:any, fact3:any, fact4:any).

:- initialization(init).

link_between_two_my_facts(X, Y) :-
  fact(X, Z), fact(Z, Y).

init:-
  absolute_file_name('fact.db', File, [access(write)]),
  db_attach(File, []).
