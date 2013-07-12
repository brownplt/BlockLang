/**
 * User: spencergordon
 * Date: 6/30/13
 * Time: 12:17 PM
 * @desc Various global constants and enums
 */

goog.provide('Ray.Globals');

Ray.Globals.Expressions = {};
var Expressions = Ray.Globals.Expressions;
Expressions.Pair = 0;
Expressions.Empty = 1;
Expressions.Num = 2;
Expressions.Char = 15;
Expressions.Boolean = 3;
Expressions.Str = 5;
Expressions.Primitive = 4;
Expressions.Lambda = 6;
Expressions.Name = 7;
Expressions.Cond = 8;
Expressions.If = 9;
Expressions.And = 10;
Expressions.Or = 11;
Expressions.App = 12;
Expressions.Arguments = 13;
Expressions.ArgumentSpec = 14;

Ray.Globals.Values = {};
var Values = Ray.Globals.Values;
Values.Pair = 0;
Values.Empty = 1;
Values.Boolean = 2;
Values.Num = 3;
Values.Str = 4;
Values.Char = 5;
Values.Primitive = 6;
Values.Closure = 7;
Values.ArgumentSpec = 8;
Values.Arguments = 9;

Ray.Globals.Types = {};
var Types = Ray.Globals.Types;
Types.Unknown = 0;
Types.Num = 1;
Types.Str = 2;
Types.Char = 3;
Types.Boolean = 4;
Types.List = 5;
Types.ListOfTypes = 6;
Types.NArityType = 7;
Types.ArgumentType = 8;
Types.FunctionType = 9;

Ray.Globals.Blocks = {};
var Blocks = Ray.Globals.Blocks;
Blocks.Num = 0;
Blocks.Char = 1;
Blocks.Str = 2;
Blocks.Boolean = 3;
Blocks.Cond = 4;
Blocks.If = 5;
Blocks.Cons = 6;
Blocks.First = 7;
Blocks.Rest = 8;
Blocks.Empty = 9;
Blocks.App = 10;
Blocks.Argument = 11;

Ray.Globals.Priorities = {};
var Priorities = Ray.Globals.Priorities;
Priorities.BASIC_NUMBER_OPERATION = 3;
Priorities.PRIMITIVE_DATA_VALUE = 2;
Priorities.ARGUMENT = 1;

