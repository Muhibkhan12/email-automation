import { motion } from "motion/react";

interface User {
  name: string;
  password: number;
}

const user: User = {
  name: "Muhib",
  password: 1234,
};

const Name = () => {
  return (
    <main className="bg-black">
      {/* Section 1 */}
      <section className="sticky top-0 h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-8xl font-bold text-black">
            {user.name}
          </h1>

          <p className="mt-6 text-xl text-gray-600">
            Scroll Down ↓
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <motion.section
        initial={{
          opacity: 0,
          y: 120,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.8,
        }}
        viewport={{ once: true, amount: 0.3 }}
        className="relative z-20 h-screen bg-black flex items-center justify-center"
      >
        <div className="text-center">
          <h1 className="text-8xl font-bold text-white">
            {user.password}
          </h1>

          <p className="mt-6 text-gray-400">
            This section overlaps the first one.
          </p>
        </div>
      </motion.section>
    </main>
  );
};

export default Name;