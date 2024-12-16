const asyncHandler = (requestHandler) => {
  (req, resp, next) => {
    Promise.resolve(requestHandler(req, resp, next)).
    catch((err) => next(err));
  };
};

export { asyncHandler };













//const asyncHandler = (func) => () => {};
//const asyncH = (func) => () => {};
//const asyncH1 = (func) => async () => {};

/*const asyncHandler = (func) => async (req, resp, next) => {
  try {
    await func(req, resp, next);
  } catch (err) {
    resp.status(err.code || 500).json({
      sucess: false,
      message: err.message,
    });
  }
};*/

// const as = (func)=> {
//     return (fu) => {
//         return func * fu;
//     }
// }

// const res = as(2);
// console.log(res(5))
