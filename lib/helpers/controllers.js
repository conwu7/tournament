// send a json success message with an optional result value
exports.sendSuccess = function (res, result) {
    res.json({success: true, result})
}
/*
returns a function
for controllers that only use the logic and return values based on the success/failure of the logic function
by default, logic argument is req.body.
to use req.params as the argument set the second argument to true
to use both req.body and req.params (merged into one object), set the third argument to true
User is always added to the argument
*/
exports.commonController = function (logic, useReqBodyAndParams, useReqParamsOnly) {
    return (
        async function (req, res, next) {
            try {
                const user = req.user;
                const logicArguments =
                    useReqBodyAndParams ? {...req.body, ...req.params, user}
                     : useReqParamsOnly ? {...req.params, user}
                        : {...req.body, user}
                const returnValue = await logic(logicArguments);
                res.json({success: true, result: returnValue})
            } catch (e) {
                next(e);
            }
        }
    )
}