/**
 * User: spencergordon
 * Date: 6/30/13
 * Time: 12:17 PM
 * @desc Various global constants and enums
 */

goog.provide('Ray.Enums');

Ray.Enums.Expressions = {};
var Expressions = Ray.Enums.Expressions;
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
