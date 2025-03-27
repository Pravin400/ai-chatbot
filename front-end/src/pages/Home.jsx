import React from "react";

const Home = () => {
  return (
    <div className="py-4 bg-gray-50 dark:bg-gray-900 text-neutral-300 min-h-screen pt-[12vh] h-[88vh]">
      <aside className="fixed h-full border-r-2 min-w-[16vw] bg-yellow-400 -left-[110vw] sm:left-0">
        Options
      </aside>

      <section className="md:pr-10 px-8 py-8 flex flex-col sm:pl-[20vw] border border-s-amber-500 text-white h-[88vh]">
        <div className="min-h-[90%] overflow-x-auto">
          <div className="flex flex-col gap-4">
            <p className="text-neutral-400 text-xl">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum
              facilis accusantium consectetur harum laboriosam quasi!
            </p>
            <p className="text-neutral-50">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic
              mollitia corporis, numquam quis obcaecati doloremque. Repudiandae
              itaque, a et nobis temporibus molestiae obcaecati voluptatibus
              iure animi. Nihil officiis esse totam?
            </p>
          </div>
        </div>
        <div className="min-h-[10%]">
          <form className="flex gap-4">
            <input
              type="text"
              className="border border-amber-50 p-2 rounded-3xl grow-1"
            />
            <button className="border border-amber-50 px-8 rounded-3xl flex items-center justify-center bg-neutral-600 cursor-pointer hover:bg-neutral-800">
              Submit
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
